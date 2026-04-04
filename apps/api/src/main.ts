import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");

  const swaggerConfig = new DocumentBuilder()
    .setTitle("ExpressThat Auth API")
    .setDescription("API documentation for the ExpressThat Auth service")
    .setVersion("1.0")
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, openApiDocument, {
    useGlobalPrefix: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
