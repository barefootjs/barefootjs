# syntax=docker/dockerfile:1
#
# Build & runtime image for the Echo example, intended to be executed inside a
# Cloudflare Container. Requires `bun run build` to have been run on the host
# first so dist/ contains the generated templates, client JS and shared styles.

FROM golang:1.23-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY *.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/echo-server .

FROM alpine:3.19

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=builder /out/echo-server /app/echo-server
COPY dist ./dist

ENV BASE_PATH=/examples/echo
EXPOSE 8080
USER app
CMD ["/app/echo-server"]
