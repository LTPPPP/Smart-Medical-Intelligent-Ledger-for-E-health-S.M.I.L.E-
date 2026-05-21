import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';

@Injectable()
export class HandlebarsService {
  compile(template: string, context: Record<string, any>): string {
    const compiled = Handlebars.compile(template);
    return compiled(context);
  }
}
