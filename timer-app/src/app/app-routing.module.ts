import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StopwatchComponent } from './stopwatch/stopwatch.component';
import { ImageRecogntionComponent } from './image-recogntion/image-recogntion.component';
import { QuestionsComponent } from './questions/questions.component';
import { NoodweerComponent } from './noodweer/noodweer.component';
import { SterrenpadComponent } from './sterrenpad/sterrenpad.component';
import { MoestuinComponent } from './moestuin/moestuin.component';
import { WoordwachtComponent } from './woordwacht/woordwacht.component';
import { KerstkofferComponent } from './kerstkoffer/kerstkoffer.component';


const routes: Routes = [
  { path: 'stopwatch', component: StopwatchComponent },
  { path: 'image-recognition', component: ImageRecogntionComponent },
  { path: 'kerstvragen', component: QuestionsComponent, data: { set: 'kerstvragen' } },
  { path: 'vragenkaarten', component: QuestionsComponent, data: { set: 'vragenkaarten' } },
  { path: 'hoe-goed-ken-je-mij', component: QuestionsComponent, data: { set: 'hoeGoed' } },
  { path: 'noodweer', component: NoodweerComponent },
  { path: 'sterrenpad', component: SterrenpadComponent },
  { path: 'moestuin', component: MoestuinComponent },
  { path: 'woordwacht', component: WoordwachtComponent },
  { path: 'kerstkoffer', component: KerstkofferComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
