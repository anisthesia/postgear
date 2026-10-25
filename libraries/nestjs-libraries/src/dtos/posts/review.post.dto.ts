import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestReviewDto {
  @IsIn(['TEAM', 'CLIENT'])
  target: 'TEAM' | 'CLIENT';
}

export class RequestChangesDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  comment: string;
}
