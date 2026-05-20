import { HttpInterceptorFn } from "@angular/common/http";
import { AuthService } from "../services/auth.service";
import { inject } from "@angular/core";

//  Attaches `Authorization: Bearer <jwt>` to every outgoing request when the user is signed in

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  if (!token) return next(req);

  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(cloned);
};
