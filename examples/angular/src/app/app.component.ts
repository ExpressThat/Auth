import { Component } from "@angular/core";
import { ExButton } from "@expressthat-auth/ui-angular";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [ExButton],
  templateUrl: "./app.component.html",
})
export class AppComponent {
  handleClick() {
    alert("clicked!");
  }
}
