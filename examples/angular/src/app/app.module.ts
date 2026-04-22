import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { ButtonModule } from "@expressthat-auth/ui/angular/button";
import { AppComponent } from "./app.component";

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, ButtonModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
