pub trait ResultExt<T, E> {
	fn log_err(self);
}

impl<T, E> ResultExt<T, E> for Result<T, E>
where
	E: std::fmt::Debug,
{
	fn log_err(self) {
		if let Err(err) = self {
			eprintln!("{:#?}", err);
		}
	}
}
