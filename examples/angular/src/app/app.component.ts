import { Component } from "@angular/core";
import { EXButtonModule } from "@expressthat-auth/ui/angular/eXButton";

@Component({
  standalone: true,
  selector: "app-root",
  imports: [EXButtonModule],
  template: `
    <div>
      <h1>Angular &#8212; expressthat-auth/ui</h1>
      <ex-button label="Hello from Angular"></ex-button>
    </div>
  `,
})
export class AppComponent {}
