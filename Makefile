OP=op run --no-masking --env-file .env -- 

install:
	npm install

dev:
	${OP}./bin/chat.mjs

-dev:
	./bin/chat.mjs
