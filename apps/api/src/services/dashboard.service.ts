import { db, schema } from "../db/index.js";

const { vehicles, drivers, trips, fuelLogs, expenses, maintenanceLogs } =
  schema;

export const getDashboardSummary = async () => {
  const [allVehicles, allDrivers, allTrips] = await Promise.all([
    db.select().from(vehicles),
    db.select().from(drivers),
    db.select().from(trips),
  ]);

  const activeFleet = allVehicles.filter((v) => v.status !== "RETIRED");
  const availableVehicles = allVehicles.filter((v) => v.status === "AVAILABLE");
  const inShopVehicles = allVehicles.filter((v) => v.status === "IN_SHOP");
  const onTripVehicles = allVehicles.filter((v) => v.status === "ON_TRIP");
  const retiredVehicles = allVehicles.filter((v) => v.status === "RETIRED");

  const driversOnDuty = allDrivers.filter(
    (d) => d.status === "AVAILABLE" || d.status === "ON_TRIP",
  );

  const activeTripsCount = allTrips.filter(
    (t) => t.status === "DISPATCHED",
  ).length;
  const pendingTripsCount = allTrips.filter((t) => t.status === "DRAFT").length;

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
    activeTrips: activeTripsCount,
    pendingTrips: pendingTripsCount,
    driversOnDuty: driversOnDuty.length,
    totalDrivers: allDrivers.length,
    fleetUtilization,
    vehicleStatusCounts,
  };
};

export const getReportsSummary = async () => {
  const [allVehicles, allTrips, allFuels, allExpenses, allMaintenances] =
    await Promise.all([
      db.select().from(vehicles),
      db.select().from(trips),
      db.select().from(fuelLogs),
      db.select().from(expenses),
      db.select().from(maintenanceLogs),
    ]);

  return allVehicles.map((vehicle) => {
    // 1. Gather all trips completed by this vehicle
    const vehicleTrips = allTrips.filter(
      (t) => t.vehicleId === vehicle.id && t.status === "COMPLETED",
    );
    const totalDistance = vehicleTrips.reduce(
      (sum, t) => sum + Number(t.actualDistance || 0),
      0,
    );
    const totalFuelConsumed = vehicleTrips.reduce(
      (sum, t) => sum + Number(t.fuelConsumed || 0),
      0,
    );
    const totalRevenue = vehicleTrips.reduce(
      (sum, t) => sum + Number(t.revenue),
      0,
    );

    // 2. Compute fuel efficiency: actualDistance / fuelConsumed
    const fuelEfficiency =
      totalFuelConsumed > 0
        ? Number((totalDistance / totalFuelConsumed).toFixed(2))
        : 0;

    // 3. Sum up operational costs
    const vehicleFuels = allFuels.filter((f) => f.vehicleId === vehicle.id);
    const fuelCost = vehicleFuels.reduce((sum, f) => sum + Number(f.cost), 0);

    const vehicleExpenses = allExpenses.filter(
      (e) => e.vehicleId === vehicle.id,
    );
    const generalExpenseCost = vehicleExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    const vehicleMaintenances = allMaintenances.filter(
      (m) => m.vehicleId === vehicle.id,
    );
    const maintenanceCost = vehicleMaintenances.reduce(
      (sum, m) => sum + Number(m.cost),
      0,
    );

    const totalOperationalCost =
      fuelCost + generalExpenseCost + maintenanceCost;

    // 4. Compute ROI: (Revenue - Operational Cost) / Acquisition Cost
    const acqCost = Number(vehicle.acquisitionCost) || 1;
    const vehicleRoi = Number(
      (((totalRevenue - totalOperationalCost) / acqCost) * 100).toFixed(1),
    );

    return {
      id: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      model: vehicle.model || "N/A",
      type: vehicle.type,
      odometer: vehicle.odometer,
      acquisitionCost: Number(vehicle.acquisitionCost),
      revenue: totalRevenue,
      fuelCost,
      maintenanceCost,
      generalExpenseCost,
      totalOperationalCost,
      fuelEfficiency,
      roi: vehicleRoi,
    };
  });
};

export const generateReportsCSV = async () => {
  const data = await getReportsSummary();

  const headers = [
    "Registration Number",
    "Vehicle Name",
    "Type",
    "Odometer (km)",
    "Revenue (₹)",
    "Operational Cost (₹)",
    "Fuel Cost (₹)",
    "Maintenance Cost (₹)",
    "General Expenses (₹)",
    "Fuel Efficiency (km/L)",
    "ROI (%)",
  ];

  const rows = data.map((v) => [
    `"${v.registrationNumber}"`,
    `"${v.name} ${v.model}"`,
    `"${v.type}"`,
    v.odometer,
    v.revenue,
    v.totalOperationalCost,
    v.fuelCost,
    v.maintenanceCost,
    v.generalExpenseCost,
    v.fuelEfficiency,
    v.roi,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
};
