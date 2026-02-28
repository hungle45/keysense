.PHONY: dev build lint preview test clean install

# Development
dev:
	npm run dev

# Build
build:
	npm run build

# Lint
lint:
	npm run lint

# Preview production build
preview:
	npm run preview

# Install dependencies
install:
	npm install

# Clean build artifacts
clean:
	rm -rf dist

# Type check
typecheck:
	npx tsc --noEmit
