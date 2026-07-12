import { db, schema } from "../db/index.js";

const { vehicles, drivers } = schema;

export const getDashboardSummary = async () => {
  const [allVehicles, allDrivers] = await Promise.all([
    db.select().from(vehicles),
    db.select().from(drivers),
  ]);

  const activeFleet = allVehicles.filter((v) => v.status !== "RETIRED");
  const availableVehicles = allVehicles.filter((v) => v.status === "AVAILABLE");
  const inShopVehicles = allVehicles.filter((v) => v.status === "IN_SHOP");
  const onTripVehicles = allVehicles.filter((v) => v.status === "ON_TRIP");
  const retiredVehicles = allVehicles.filter((v) => v.status === "RETIRED");

  const driversOnDuty = allDrivers.filter(
    (d) => d.status === "AVAILABLE" || d.status === "ON_TRIP",
  );

  const fleetUtilization =
    activeFleet.length > 0
      ? Math.round((onTripVehicles.length / activeFleet.length) * 100)
      : 0;

  const vehicleStatusCounts = {
    AVAILABLE: availableVehicles.length,
    ON_TRIP: onTripVehicles.length,
    IN_SHOP: inShopVehicles.length,
    RETIRED: retiredVehicles.length,
  };

  return {
    fleet: activeFleet.length,
    availableVehicles: availableVehicles.length,
    vehiclesInMaintenance: inShopVehicles.length,
    driversOnDuty: driversOnDuty.length,
    totalDrivers: allDrivers.length,
    fleetUtilization,
    vehicleStatusCounts,
  };
};
