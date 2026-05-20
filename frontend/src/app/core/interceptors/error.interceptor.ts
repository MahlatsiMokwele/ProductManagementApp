import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { MatSnackBar } from "@angular/material/snack-bar";
import { catchError, throwError } from "rxjs";
import { Router } from "@angular/router";
import { inject } from "@angular/core";

import { AuthService } from "../services/auth.service";

/*
 * HTTP error handling.
 *   - 401 → token is bad or missing; sign the user out and bounce them to /login.
 *   - 403 → wrong role; show a snackbar but stay on the page.
 *   - 4xx → show the server-supplied `error` field (our backend uses { error, traceId }).
 *   - 5xx → generic message; we don't want to leak server internals.
 */

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snack = inject(MatSnackBar);
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const message = extractMessage(err);

      switch (err.status) {
        case 0:
          snack.open(
            "Cannot reach the server. Is the API running?",
            "Dismiss",
            { duration: 5000 },
          );
          break;
        case 401:
          auth.logout(false);
          router.navigateByUrl("/login");
          snack.open("Session expired. Please sign in again.", "Dismiss", {
            duration: 4000,
          });
          break;
        case 403:
          snack.open(
            "You do not have permission to perform that action.",
            "Dismiss",
            { duration: 4000 },
          );
          break;
        case 404:
          snack.open(message ?? "Not found.", "Dismiss", { duration: 4000 });
          break;
        case 409:
          snack.open(message ?? "Conflict.", "Dismiss", { duration: 4000 });
          break;
        default:
          if (err.status >= 500) {
            snack.open(
              "Something went wrong on the server. Try again shortly.",
              "Dismiss",
              { duration: 5000 },
            );
          } else if (message) {
            snack.open(message, "Dismiss", { duration: 4000 });
          }
      }
      return throwError(() => err);
    }),
  );
};

function extractMessage(err: HttpErrorResponse): string | null {
  if (err.error && typeof err.error === "object" && "error" in err.error) {
    const e = (err.error as { error: unknown }).error;
    if (typeof e === "string") return e;
  }
  return null;
}
