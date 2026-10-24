CREATE TABLE "products" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"swatch" text DEFAULT '#414536' NOT NULL,
	"images" jsonb NOT NULL,
	"sprite" text,
	"sample" boolean DEFAULT false NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" integer,
	"position" integer DEFAULT 0 NOT NULL
);
