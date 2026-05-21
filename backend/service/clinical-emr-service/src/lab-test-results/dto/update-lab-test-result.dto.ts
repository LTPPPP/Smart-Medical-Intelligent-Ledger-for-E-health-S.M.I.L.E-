import { PartialType } from '@nestjs/swagger';
import { CreateLabTestResultDto } from './create-lab-test-result.dto';

export class UpdateLabTestResultDto extends PartialType(CreateLabTestResultDto) {}
