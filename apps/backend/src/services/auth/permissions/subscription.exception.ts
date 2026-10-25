import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { AuthorizationActions, Sections, SubscriptionException } from '@gitroom/backend/services/auth/permissions/permission.exception.class';

@Catch(SubscriptionException)
export class SubscriptionExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const error: { section: Sections; action: AuthorizationActions } =
      exception.getResponse() as any;

    const message = getErrorMessage(error);

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}

const getErrorMessage = (error: {
  section: Sections;
  action: AuthorizationActions;
}) => {
  switch (error.section) {
    case Sections.POSTS_PER_MONTH:
      switch (error.action) {
        default:
          return 'Your workspace has reached its limit for posts. Please contact your administrator.';
      }
    case Sections.CHANNEL:
      switch (error.action) {
        default:
          return 'Your workspace has reached its limit for channels. Please contact your administrator.';
      }
    case Sections.WEBHOOKS:
      switch (error.action) {
        default:
          return 'Your workspace has reached its limit for webhooks. Please contact your administrator.';
      }
    case Sections.VIDEOS_PER_MONTH:
      switch (error.action) {
        default:
          return 'Your workspace has reached its limit for generated videos. Please contact your administrator.';
      }
    case Sections.CLIPPING_MINUTES:
      switch (error.action) {
        default:
          return 'Your workspace has used all of its clipping minutes for this month. Please contact your administrator.';
      }
  }
};
