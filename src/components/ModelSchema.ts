import { Schema, SchemaDefinition, SchemaOptions } from 'mongoose';
import { toJSON,paginate as pg } from '@/utils';

class ModelSchema<T> extends Schema<T> {
  constructor(definition?: SchemaDefinition<T>, options?: SchemaOptions, paginate?: boolean) {
    super(definition, options);

    this.plugin(toJSON);
    // if (paginate){
    //     this.plugin(pg)
    // }
  }

}

export default ModelSchema;
