import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { UiAngularModule } from "@expressthat-auth/ui-angular";

import { AppComponent } from "./app.component";

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, UiAngularModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
