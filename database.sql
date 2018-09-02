CREATE TABLE "discord_pair_code" (
  "id_pair_code" serial NOT NULL,
  "pair_code" character varying(50),
  "moodle_login" character varying(100),
  "moodle_firstname" character varying(50),
  "moodle_lastname" character varying(50)
);

CREATE TABLE "discord_user" (
  "id_discord_user" serial NOT NULL,
  "moodle_login" character varying(100),
  "moodle_firstname" character varying(50),
  "moodle_lastname" character varying(50),
  "discord_id" character varying(100)
);