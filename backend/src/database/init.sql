-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY,
    role VARCHAR DEFAULT 'user',
    email VARCHAR NOT NULL,
    "fullName" VARCHAR DEFAULT '',
    password VARCHAR NOT NULL
);

-- Create offer table
CREATE TABLE IF NOT EXISTS offer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR NOT NULL,
    price DECIMAL NOT NULL,
    "customerId" VARCHAR NOT NULL,
    "customerFullName" VARCHAR NOT NULL,
    "yachtName" VARCHAR NOT NULL,
    "yachtModel" VARCHAR NOT NULL,
    "imageUrls" VARCHAR[],
    "videoUrls" VARCHAR[],
    status VARCHAR DEFAULT 'pending',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pricelist table
CREATE TABLE IF NOT EXISTS pricelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "serviceName" VARCHAR DEFAULT '',
    "priceInEuroWithoutVAT" DECIMAL(10,2) DEFAULT 0,
    "unitsOfMeasurement" VARCHAR DEFAULT '',
    description VARCHAR DEFAULT ''
);

-- Create warehouse table
CREATE TABLE IF NOT EXISTS warehouse (
    id VARCHAR PRIMARY KEY DEFAULT '',
    name VARCHAR DEFAULT '',
    quantity VARCHAR DEFAULT '',
    "pricePerUnit" VARCHAR DEFAULT '',
    inventory VARCHAR DEFAULT '',
    comment VARCHAR DEFAULT '',
    "countryCode" VARCHAR NOT NULL DEFAULT '',
    "serviceCategory" JSONB DEFAULT '{}'
);

-- Create warehouse_history table
CREATE TABLE IF NOT EXISTS warehouse_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "warehouseId" VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    data JSONB NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create offer_history table
CREATE TABLE IF NOT EXISTS offer_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "offerId" VARCHAR NOT NULL,
    "userId" VARCHAR NOT NULL,
    "changeDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "changeDescription" VARCHAR DEFAULT ''
);

-- Create order table
CREATE TABLE IF NOT EXISTS "order" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "offerId" VARCHAR NOT NULL,
    "customerId" VARCHAR DEFAULT '',
    status VARCHAR DEFAULT 'Created',
    "processImageUrls" VARCHAR[],
    "processVideoUrls" VARCHAR[],
    "resultImageUrls" VARCHAR[],
    "resultVideoUrls" VARCHAR[],
    "tabImageUrls" VARCHAR[],
    "tabVideoUrls" VARCHAR[],
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_timer table
CREATE TABLE IF NOT EXISTS order_timer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderId" VARCHAR NOT NULL,
    "userId" VARCHAR DEFAULT '',
    "startTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP,
    "isRunning" BOOLEAN DEFAULT true,
    "isPaused" BOOLEAN DEFAULT false,
    "pauseTime" TIMESTAMP,
    "totalPausedTime" BIGINT,
    "totalDuration" BIGINT,
    status VARCHAR DEFAULT 'In Progress'
);

-- Create yacht table
CREATE TABLE IF NOT EXISTS yacht (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    model VARCHAR NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_workers table (for many-to-many relationship)
CREATE TABLE IF NOT EXISTS order_workers (
    "orderId" UUID REFERENCES "order"(id),
    "usersId" VARCHAR REFERENCES users(id),
    PRIMARY KEY ("orderId", "usersId")
); 