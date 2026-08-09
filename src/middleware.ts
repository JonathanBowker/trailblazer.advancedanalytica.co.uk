import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient, isSupabaseConfigured } from './lib/supabaseServer';
import { trailblazerFormPath } from './lib/site';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  if (url.pathname === '/') {
    return context.redirect(trailblazerFormPath);
  }

  if (!isSupabaseConfigured) {
    context.locals.user = null;
    return next();
  }

  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  context.locals.user = user ?? null;

  if (url.pathname === '/login' && user) {
    return context.redirect(trailblazerFormPath);
  }

  return next();
});
