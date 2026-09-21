import app from '../src/app';

export const onRequest: PagesFunction<any> = async (context) => {
  return app.fetch(context.request, context.env, context as any);
};
