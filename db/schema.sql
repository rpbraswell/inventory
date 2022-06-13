use warehouse;

drop table if exists receiving;
drop table if exists shipping;
drop table if exists items;

create table if not exists `categories` (
        `id` int unsigned not null auto_increment,
	`category` varchar(80) character set utf8 collate utf8_unicode_ci not null,
	primary key (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 default charset=utf8;

create table if not exists `units` (
        `id` int unsigned not null auto_increment,
	`unit` varchar(80) character set utf8 collate utf8_unicode_ci not null,
	primary key (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 default charset=utf8;

create table `items` (
	`id` int unsigned not null auto_increment,
	`name` varchar(80) character set utf8 collate utf8_unicode_ci not null,
	`category` int unsigned not null,
	`itemClass` enum('grocery','USDA') not null default 'grocery',
	`itemType` enum('dry','frozen','refrigerated') not null default 'dry',
	`unit` int unsigned not null,
	`qty` int unsigned not null default '0',
	`lastUpdate` timestamp not null default current_timestamp on update current_timestamp,
    key `FK_category` (`category`),
    key `FK_unit` (`unit`),
	primary key (`id`),
	unique key `items_unique_key` (`name`, `itemClass`, `itemType`),
	constraint `FK_category` foreign key (`category`) references `categories` (`id`),
	constraint `FK_unit` foreign key (`unit`) references `units` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 default charset=utf8;

create table if not exists `receiving` (
	`id` int unsigned not null auto_increment,
	`itemId` int unsigned not null,
	`qty` int not null,
	`receivedAt` timestamp not null default current_timestamp on update current_timestamp,
	primary key (`id`),
        key `FK_received_item` (`itemId`),
	constraint `FK_received_item` foreign key (`itemId`) references `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 default charset=utf8;


create table if not exists `shipping` (
	`id` int unsigned not null auto_increment,
	`itemId` int unsigned not null,
	`qty` int not null,
	`shippedAt` timestamp not null default current_timestamp on update current_timestamp,
	primary key (`id`),
        key `FK_shipped_item` (`itemId`),
	constraint `FK_shipped_item` foreign key (`itemId`) references `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 default charset=utf8;




