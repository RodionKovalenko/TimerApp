import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, LocationStrategy, HashLocationStrategy } from "@angular/common";
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { StopwatchComponent } from './stopwatch/stopwatch.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { AppRoutingModule } from './app-routing.module';
import { enableProdMode } from '@angular/core';
import { ImageRecogntionComponent } from './image-recogntion/image-recogntion.component';
import { Router, RouteReuseStrategy } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CacheRouteReuseStrategyService } from './cache-route-reuse-strategy.service';
import { QuestionsComponent } from './questions/questions.component';
import { NoodweerComponent } from './noodweer/noodweer.component';
import { SterrenpadComponent } from './sterrenpad/sterrenpad.component';
import { MoestuinComponent } from './moestuin/moestuin.component';
import { WoordwachtComponent } from './woordwacht/woordwacht.component';
import { KerstkofferComponent } from './kerstkoffer/kerstkoffer.component';

enableProdMode();

@NgModule({
  declarations: [
    AppComponent,
    StopwatchComponent,
    ImageRecogntionComponent,
    QuestionsComponent,
    NoodweerComponent,
    SterrenpadComponent,
    MoestuinComponent,
    WoordwachtComponent,
    KerstkofferComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatMenuModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    AppRoutingModule
  ],
  providers: [
    {
      provide: RouteReuseStrategy,
      useClass: CacheRouteReuseStrategyService
    },
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor(router: Router) {
    router.navigateByUrl('/', { skipLocationChange: false }).then(() => {
      router.navigate(['/']);
    });
  }
}
