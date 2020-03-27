import { Injectable } from '@angular/core';
import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CacheRouteReuseStrategyService  implements RouteReuseStrategy {

  storedRouteHandles = new Map<string, DetachedRouteHandle>();
  allowRetriveCache = {
    'image-recognition': true
  };
  shouldReuseRoute(before: ActivatedRouteSnapshot, curr:  ActivatedRouteSnapshot): boolean {
  if (this.getPath(before) === 'stopwatch' && this.getPath(curr) === 'image-recognition') {    
      this.allowRetriveCache['image-recognition'] = true;
    } else {
      this.allowRetriveCache['stopwatch'] = true;
    }

    return before.routeConfig === curr.routeConfig;
  }
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.storedRouteHandles.get(this.getPath(route)) as DetachedRouteHandle;
  }
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const path = this.getPath(route);
    if (this.allowRetriveCache[path]) {
      return this.storedRouteHandles.has(this.getPath(route));
    }
    
    return false;
  }
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    const path = this.getPath(route);
    if (this.allowRetriveCache.hasOwnProperty(path)) {
      return true;
    }
    return false;
  }
  store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void {
    this.storedRouteHandles.set(this.getPath(route), detachedTree);
  }
  private getPath(route: ActivatedRouteSnapshot): string {
    if (route.routeConfig !== null && route.routeConfig.path !== null) {
      return route.routeConfig.path;
    }
    return '';
  }
}
