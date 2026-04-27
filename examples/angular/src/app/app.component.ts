import { Component } from "@angular/core";
import { ExTestButton } from "@expressthat-auth/ui-angular";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [ExTestButton],
  templateUrl: "./app.component.html",
})
export class AppComponent {
  handleClick() {
    alert("clicked!");
  }
}
