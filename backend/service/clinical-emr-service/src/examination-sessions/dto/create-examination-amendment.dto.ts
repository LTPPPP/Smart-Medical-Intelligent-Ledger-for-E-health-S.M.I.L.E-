import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateExaminationAmendmentDto {
  @ApiProperty({ description: 'Reason for amending a finalized encounter' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  amendment_reason: string;

  @ApiProperty({ description: 'Append-only amendment note' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  amendment_text: string;

  @ApiProperty({ description: 'User UUID creating the amendment' })
  @IsUUID()
  amended_by: string;
}
