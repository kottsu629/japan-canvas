SET NAMES utf8mb4;

create table users (
    id int primary key auto_increment,
    name varchar(255) not null,
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    created_at timestamp default current_timestamp
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

create table prefectures (
    id int primary key,
    name varchar(20) not null unique,
    region varchar(20) not null
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

create table visits (
    id int primary key auto_increment,
    user_id int not null,
    prefecture_id int not null,
    visited_at date not null,
    created_at timestamp default current_timestamp,
    key idx_user_id (user_id),
    key idx_prefecture_id (prefecture_id), 
    constraint fk_visits_users 
        foreign key (user_id) references users(id)
        on delete cascade,
    constraint fk_visits_prefectures
        foreign key (prefecture_id) references prefectures(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

create table tourist_spots (
    id int primary key auto_increment,
    prefecture_id int not null,
    name varchar(255) not null,
    `rank` int not null,
    image_url varchar(255),
    affiliate_url varchar(255),
    created_at timestamp default current_timestamp,
    key idx_prefecture_id (prefecture_id),
    constraint fk_tourist_spots_prefectures
        foreign key (prefecture_id) references prefectures(id)
)Engine = InnoDB DEFAULT CHARSET = utf8mb4;