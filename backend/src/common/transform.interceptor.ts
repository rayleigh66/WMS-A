import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, map } from "rxjs";

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // handle paginated responses
        if (
          data &&
          typeof data === "object" &&
          "data" in data &&
          "total" in data
        ) {
          return data;
        }
        return data;
      }),
    );
  }
}
