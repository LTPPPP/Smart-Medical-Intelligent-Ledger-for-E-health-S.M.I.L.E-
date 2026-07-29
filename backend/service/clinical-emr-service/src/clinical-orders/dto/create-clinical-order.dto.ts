import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
} from 'class-validator';
import { OrderPriority } from '../../utils/enums/order-priority.enum';
import { OrderStatus } from '../../utils/enums/order-status.enum';
import { OrderType } from '../../utils/enums/order-type.enum';

export class CreateClinicalOrderDto {
  @IsString()
  @IsOptional()
  session_id?: string;

  @IsString()
  @IsOptional()
  record_id?: string;

  @IsString()
  patient_id: string;

  @IsString()
  ordered_by: string;

  @IsEnum(OrderType)
  order_type: OrderType;

  @IsString()
  test_type: string;

  @IsString()
  @IsOptional()
  clinical_indication?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  teeth_numbers?: number[];

  @IsEnum(OrderPriority)
  @IsOptional()
  urgency?: OrderPriority;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsDateString()
  @IsOptional()
  ordered_date?: string;

  @IsDateString()
  @IsOptional()
  scheduled_date?: string;

  @IsDateString()
  @IsOptional()
  completed_date?: string;

  @IsString()
  @IsOptional()
  result_url?: string;

  @IsString()
  @IsOptional()
  report?: string;
}
