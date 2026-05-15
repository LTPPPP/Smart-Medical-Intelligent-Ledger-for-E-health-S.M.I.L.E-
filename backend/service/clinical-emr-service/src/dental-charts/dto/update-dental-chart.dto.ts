import { PartialType } from '@nestjs/swagger';
import { CreateDentalChartDto } from './create-dental-chart.dto';

export class UpdateDentalChartDto extends PartialType(CreateDentalChartDto) {}
