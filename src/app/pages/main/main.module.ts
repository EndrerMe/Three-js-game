// Vendors
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

// Routers
import { MainRoutingModule } from 'src/app/pages/main/main-routing.module';
// Components
import { MainComponent } from 'src/app/pages/main/main.component';

@NgModule({
  declarations: [
    MainComponent
  ],
  imports: [
    MainRoutingModule,
    BrowserModule,
    MainRoutingModule,
  ],
  providers: [
  ],
  bootstrap: []
})
export class MainModule { }
