FROM golang:1.25.4-alpine

WORKDIR /backend

RUN apk add --no-cache curl

COPY . .

RUN go build -o backend .

EXPOSE 8080

CMD ["./backend"]