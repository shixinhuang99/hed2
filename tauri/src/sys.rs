use std::{env, fs, path::PathBuf};

use anyhow::Result;

pub fn read_hosts() -> Result<String> {
	let hosts_path = get_hosts_path()?;
	let content = fs::read_to_string(hosts_path)?;

	Ok(content)
}

pub fn write_hosts(mut content: String) -> Result<()> {
	if cfg!(windows) {
		content = content.replace('\n', "\r\n");
	}

	let hosts_path = get_hosts_path()?;
	let tmp_file = env::temp_dir().join("hed2_tmp");
	fs::write(&tmp_file, content)?;
	fs::copy(&tmp_file, hosts_path)?;
	fs::remove_file(&tmp_file)?;

	Ok(())
}

pub fn check_hosts_readonly() -> Result<()> {
	let hosts_path = get_hosts_path()?;
	let permissions = fs::metadata(hosts_path)?.permissions();

	if permissions.readonly() {
		anyhow::bail!(
			"The hosts file is in read-only mode, please disable it manually"
		);
	}

	Ok(())
}

pub fn open_hosts_dir() -> Result<()> {
	let hosts_path = get_hosts_path()?;
	if let Some(dir) = hosts_path.parent() {
		opener::open(dir)?;
	}

	Ok(())
}

#[cfg(all(not(dev), windows))]
fn get_hosts_path() -> Result<PathBuf> {
	let sys_drive = env::var("SYSTEMDRIVE")?;

	Ok(PathBuf::from(format!(
		r"{}\Windows\System32\drivers\etc\hosts",
		sys_drive
	)))
}

#[cfg(all(not(dev), unix))]
fn get_hosts_path() -> Result<PathBuf> {
	Ok(PathBuf::from("/etc/hosts"))
}

#[cfg(dev)]
fn get_hosts_path() -> Result<PathBuf> {
	let mut cwd = env::current_dir()?;

	cwd.push("tmp");
	cwd.push("hosts");

	Ok(cwd)
}
