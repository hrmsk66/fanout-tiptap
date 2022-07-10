/// <reference types="@fastly/js-compute" />
import {
  decodeWebSocketEvents,
  encodeWebSocketEvents,
  WebSocketContext,
  WebSocketMessageFormat,
} from "@fanoutio/grip";
import { Publisher } from "@fastly/grip-compute-js";
import { GRIP_URL } from "./env";

addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event: FetchEvent) {
  const url = new URL(event.request.url);
  console.log("Version: " + fastly.env.get("FASTLY_SERVICE_VERSION"));
  console.log(url.pathname);
  const channel = url.pathname;

  if (channel !== null) {
    let cid = event.request.headers.get("connection-id") || "";

    const ab: ArrayBuffer = await event.request.arrayBuffer();

    // console.log("Decoding arrayBuffer: " + ab.byteLength);
    // const bytes = new Uint8Array(ab);
    // console.log("(STRING): " + bin2str(bytes));
    // console.log("(HEX): " + bin2hex(bytes));

    const inEvents = decodeWebSocketEvents(Buffer.from(ab));

    const wsContext = new WebSocketContext(cid, {}, inEvents);
    console.log("Orig: " + JSON.stringify(wsContext));

    let responseString = "";
    if (wsContext.isOpening()) {
      // Open the WebSocket and subscribe it to a channel:
      wsContext.accept();
      wsContext.subscribe(channel);
      // The above commands made to the wsContext are buffered in the wsContext as "outgoing events".
      // Obtain them and write them to the response.
      const outEvents = wsContext.getOutgoingEvents();
      responseString += encodeWebSocketEvents(outEvents);
      console.log("responseString: " + bin2str(encodeWebSocketEvents(outEvents)));

      // Set the headers required by the GRIP proxy:
      const headers = wsContext.toHeaders();
      return new Response(responseString, { status: 200, headers });
    }

    try {
      const messagesToPublish = [];
      while (wsContext.canRecv()) {
        let message;
        try {
          message = wsContext.recvRaw();
        } catch (e) {
          console.log("client disconnected");
          message = null;
        }

        if (message == null) {
          console.log("client closed");
          wsContext.close();

          const headers = wsContext.toHeaders();
          return new Response("", { status: 200, headers });
        }

        // const str = new WebSocketMessageFormat("HELLO");
        // messagesToPublish.push({
        //   channel,
        //   messageFormat: str,
        // });

        // const bin = new WebSocketMessageFormat(Buffer.from("HELLO"));
        // messagesToPublish.push({
        //   channel,
        //   messageFormat: bin,
        // });

        const messageFormat = new WebSocketMessageFormat(message);
        messagesToPublish.push({
          channel,
          messageFormat,
        });

        if (messagesToPublish.length > 0) {
          console.log("Publishing " + messagesToPublish.length + " message(s)");
          const publisher = new Publisher(GRIP_URL);

          for (const messageToPublish of messagesToPublish) {
            const { channel, messageFormat } = messageToPublish;
            console.log("channel: " + channel);
            console.log("messageFormat: " + JSON.stringify(messageFormat.export()));
            await publisher.publishFormats(url.pathname, messageFormat);
            console.log("Published");
          }
        } else {
          console.log("No messages queued");
        }

        // wsContext.send("HELLO via 200");
        // wsContext.sendBinary(Buffer.from("HELLO via 200"));

        // const outEvents = wsContext.getOutgoingEvents();
        // responseString += encodeWebSocketEvents(outEvents);
        // console.log("responseString: " + bin2str(encodeWebSocketEvents(outEvents)));

        // Set the headers required by the GRIP proxy:
        const headers = wsContext.toHeaders();
        return new Response(responseString, { status: 200, headers });
      }
    } catch ({ message, context }) {
      console.log("Returning 500...");
      return new Response(
        "Publish failed!\n" + message + "\n" + JSON.stringify(context, null, 2) + "\n",
        { status: 500, headers: { "Content-Type": "text/plain" } }
      );
    }
  }
  console.log("Returning 404...");
  return new Response("Not found.\n", { status: 404, headers: { "Content-Type": "text/plain" } });
}

function bin2str(bytes: Uint8Array) {
  const str: string[] = [];
  bytes.forEach((b) => str.push(String.fromCharCode(b)));
  return str.join("");
}

function bin2hex(bytes: Uint8Array) {
  const hex: string[] = [];
  bytes.forEach((b, i) => {
    let bs = b.toString(16);
    if (bs.length < 2) {
      bs = "0" + bs;
    }
    if (i !== 0 && i % 2 == 0) {
      hex.push(" ");
    }
    hex.push(bs);
  });
  return hex.join("");
}
