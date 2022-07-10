use fastly::experimental::RequestUpgradeWebsocket;
use fastly::http::StatusCode;
use fastly::{mime, Error, Request, Response};

fn main() -> Result<(), Error> {
    let req = Request::from_client();

    match req.get_path() {
        // If request is to the `/` path...
        "/" => {
            Ok(Response::from_status(StatusCode::OK)
                            .with_content_type(mime::TEXT_HTML_UTF_8)
                            .with_body(include_str!("../../tiptap-client/build/index.html")).send_to_client())
        },
        "/static/js/main.e49d238a.js" => {
            Ok(Response::from_status(StatusCode::OK)
                .with_content_type(mime::APPLICATION_JAVASCRIPT)
                .with_body(include_str!("../../tiptap-client/build/static/js/main.e49d238a.js")).send_to_client())
        },
        "/static/js/main.e49d238a.js.map" => {
            Ok(Response::from_status(StatusCode::OK)
                .with_content_type(mime::APPLICATION_JSON)
                .with_body(include_str!("../../tiptap-client/build/static/js/main.e49d238a.js.map")).send_to_client())
        },
        "/static/css/main.96a4a974.css" => {
            Ok(Response::from_status(StatusCode::OK)
                .with_content_type(mime::TEXT_CSS)
                .with_body(include_str!("../../tiptap-client/build/static/css/main.96a4a974.css")).send_to_client())
        },
        "/static/css/main.96a4a974.css.map" => {
            Ok(Response::from_status(StatusCode::OK)
                .with_content_type(mime::APPLICATION_JSON)
                .with_body(include_str!("../../tiptap-client/build/static/css/main.96a4a974.css.map")).send_to_client())
        },
        "/remixicon-reduced.symbol.svg" => {
            Ok(Response::from_status(StatusCode::OK)
                .with_content_type(mime::IMAGE_SVG)
                .with_body(include_str!("../../tiptap-client/build/remixicon-reduced.symbol.svg")).send_to_client())
        },
        "/favicon.svg" => {
            Ok(Response::from_status(StatusCode::OK)
                .with_content_type(mime::IMAGE_SVG)
                .with_body(include_bytes!("../../tiptap-client/build/favicon.svg").as_ref()).send_to_client())
        },
        "/pop" => {
            Ok(Response::from_body(std::env::var("FASTLY_POP").unwrap()).with_header("Access-Control-Allow-Origin", "*").send_to_client())
        },
        _ => Ok(req.upgrade_websocket("kake-ws-backend")?)
    }
}
