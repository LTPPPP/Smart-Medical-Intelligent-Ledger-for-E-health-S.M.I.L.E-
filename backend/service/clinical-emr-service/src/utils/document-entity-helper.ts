import { Transform } from 'class-transformer';

export class EntityDocumentHelper {
  @Transform(
    (value) => {
      if ('value' in value) {
        // Issue Reference
        return value.obj[value.key].toString();
      }

      return 'unknown value';
    },
    {
      toPlainOnly: true,
    },
  )
  public _id: string;
}
