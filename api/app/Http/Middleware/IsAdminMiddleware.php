<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class IsAdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated AND is an admin
        if (Auth::check() && Auth::user()->is_admin) {
            return $next($request); // User is admin, continue request
        }

        // If not admin, return unauthorized response
        return response()->json(['error' => 'Unauthorized. Admin access required.'], 403);
    }
}
