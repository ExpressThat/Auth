import { Controller, Get, Query } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("name")
  @ApiResponse({
    status: 200,
    description: "Returns a greeting message with the provided name.",
    schema: { example: "Hello, John!" },
    type: String,
  })
  async getName(@Query("name") name: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate async operation
    return `Hello, ${name}!`;
  }
}
