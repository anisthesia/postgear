# postgear on AWS: one EC2 host running Docker Compose (Caddy, Postiz, Postgres, Redis, Temporal).
# State is local (terraform.tfstate, git-ignored). App secrets are generated on the host, not here.

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.region
  default_tags { tags = { Project = "postgear" } }
}

variable "region"        { default = "ap-south-1" }
variable "instance_type" { default = "t3.small" }
variable "domain"        { default = "social.ridepro.in" }
variable "zone_name"     { default = "ridepro.in" }
variable "ssh_cidr"      { description = "CIDR allowed to SSH, e.g. your IP/32" }
variable "ssh_pubkey_path" { default = "~/.ssh/postgear_aws.pub" }

data "aws_vpc" "default" { default = true }

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
}

data "aws_route53_zone" "zone" { name = var.zone_name }

resource "aws_key_pair" "postgear" {
  key_name   = "postgear"
  public_key = file(pathexpand(var.ssh_pubkey_path))
}

resource "aws_security_group" "postgear" {
  name        = "postgear"
  description = "postgear web + admin SSH"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH from admin IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
  }
  ingress {
    description      = "HTTP (ACME + redirect)"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  ingress {
    description      = "HTTPS"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_instance" "postgear" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.postgear.key_name
  vpc_security_group_ids = [aws_security_group.postgear.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }

  metadata_options {
    http_tokens = "required" # IMDSv2 only
  }

  user_data = file("${path.module}/user-data.sh")

  tags = { Name = "postgear" }

  lifecycle { ignore_changes = [ami, user_data] }
}

resource "aws_eip" "postgear" {
  instance = aws_instance.postgear.id
  domain   = "vpc"
  tags     = { Name = "postgear" }
}

resource "aws_route53_record" "app" {
  zone_id = data.aws_route53_zone.zone.zone_id
  name    = var.domain
  type    = "A"
  ttl     = 300
  records = [aws_eip.postgear.public_ip]
}

output "public_ip"   { value = aws_eip.postgear.public_ip }
output "url"         { value = "https://${var.domain}" }
output "ssh"         { value = "ssh -i ~/.ssh/postgear_aws ubuntu@${aws_eip.postgear.public_ip}" }
output "instance_id" { value = aws_instance.postgear.id }
output "security_group_id" { value = aws_security_group.postgear.id }
