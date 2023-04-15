hosts = personal-droplet

.PHONY: deploy
deploy:
	for host in $(hosts); do \
		rsync -avz --delete public/ $$host:/var/www/minesweeper; \
	done
