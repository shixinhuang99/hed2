use serde::{Deserialize, Serialize};

use crate::{
	parser::{is_ip as is_ip_impl, list_to_text, text_to_groups, Item},
	sys::get_sys_hosts_content,
};

#[derive(Deserialize, Serialize)]
pub struct GroupDTO {
	name: String,
	text: String,
	list: Vec<Item>,
}

#[tauri::command]
pub fn get_groups() -> Vec<GroupDTO> {
	let hosts_content = get_sys_hosts_content();
	let groups = text_to_groups(hosts_content);
	groups
		.into_iter()
		.map(|group| GroupDTO {
			name: group.name,
			text: group.text,
			list: group.list,
		})
		.collect()
}

#[tauri::command]
pub fn is_ip(text: String) -> bool {
	is_ip_impl(&text)
}

#[tauri::command]
pub fn update_text_by_list(list: Vec<Item>, text: String) -> String {
	list_to_text(list, text)
}
