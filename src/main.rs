use std::{env, fmt::Debug, path::PathBuf};

use axum::{routing::get, serve::Listener};
use tokio::net::{TcpListener, UnixListener};
use whiteboard::whiteboard;
use clap::{Args, Parser};
use dotenvy::dotenv;
use maud::{Markup, html};
use socketio::on_connect;
use socketioxide::SocketIo;
use sqlx::SqlitePool;
use tower_http::services::ServeDir;
use tracing::info;
use tracing_subscriber::FmtSubscriber;

mod whiteboard;
mod socketio;

#[derive(Parser)]
struct Cli {
    #[command(flatten)]
    listen: Listen,
}

#[derive(Args)]
#[group(required = true, multiple = false)]
struct Listen {
    #[arg(short, group = "listen")]
    port: Option<u16>,

    #[arg(short, group = "listen")]
    uds: Option<PathBuf>,
}

#[derive(Clone)]
struct AppState {
    pool: SqlitePool,
}

#[tokio::main]
async fn main() {
    tracing::subscriber::set_global_default(FmtSubscriber::default()).unwrap();
    let cli = Cli::parse();

    if let Some(port) = cli.listen.port {
        serve_with_listener(TcpListener::bind(format!("0.0.0.0:{port}")).await.unwrap()).await;
    } else if let Some(path) = cli.listen.uds {
        let _ = tokio::fs::remove_file(&path).await;
        tokio::fs::create_dir_all(path.parent().unwrap())
            .await
            .unwrap();

        let listener = UnixListener::bind(path.clone()).unwrap();

        serve_with_listener(listener).await;
    }
}

async fn serve_with_listener<L>(listener: L)
where
    L: Listener,
    L::Addr: Debug,
{
    dotenv().unwrap();

    let pool = SqlitePool::connect(
        &env::var("DATABASE_URL").expect("DATABASE_URL environment variable not set"),
    )
    .await
    .unwrap();

    let app_state = AppState { pool };

    let (layer, io) = SocketIo::builder()
        .with_state(app_state.clone())
        .build_layer();

    io.ns("/", on_connect);


    let app = axum::Router::new()
        .route("/", get(whiteboard))
        .route("/whiteboard", get(whiteboard))
        .fallback_service(ServeDir::new("static"))
        .with_state(app_state)
        .layer(layer);

    info!("Starting server");

    axum::serve(listener, app).await.unwrap();
}

pub fn get_meta_tags() -> Markup {
    let title = "Whiteboard";
    let description = "Draw freely.";

    html! {
        title { (title) }
        meta name="description" content=(description);

        meta property="og:url" content="https://whiteboard.jtraber.com/";
        meta property="og:type" content="website";
        meta property="og:title" content=(title);
        meta property="og:description" content=(description);

        meta name="twitter:card" content="summary_large_image";
        meta property="twitter:domain" content="whiteboard.jtraber.com";
        meta property="twitter:url" content="https://whiteboard.jtraber.com/";
        meta name="twitter:title" content=(title);
        meta name="twitter:description" content=(description);
    }
}
