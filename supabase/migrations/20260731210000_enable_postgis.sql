-- FM-0011: Enable PostGIS for parcel geometry.
-- Migration-ready for Supabase. Do NOT apply automatically.

create extension if not exists postgis;
