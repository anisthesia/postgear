import { IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetInboxDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  // ISO timestamp of the last item received, returns only older items
  @IsOptional()
  @IsDateString()
  cursor?: string;
}
