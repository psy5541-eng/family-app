-- shop_items에 gender 컬럼 추가 (공용/남성/여성)
ALTER TABLE `shop_items` ADD COLUMN `gender` text DEFAULT 'unisex' NOT NULL;
