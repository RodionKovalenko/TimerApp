import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StopwatchComponent } from './stopwatch/stopwatch.component';
import { ImageRecogntionComponent } from './image-recogntion/image-recogntion.component';


const routes: Routes = [
  { path: 'stopwatch', component: StopwatchComponent },
  { path: 'image-recognition', component: ImageRecogntionComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
