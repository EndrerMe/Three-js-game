// Vendors
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

// Routers
import { AppRoutingModule } from 'src/app/app-routing.module';
// Components
import { AppComponent } from 'src/app/app.component';
// Modules
import { MainModule } from 'src/app/pages/main/main.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MainModule,
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
