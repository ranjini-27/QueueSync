import bcrypt from "bcrypt";
import Staff from "../models/Staff.js";
import Counter from "../models/Counter.js";
import Service from "../models/Service.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { getDashboardStats, resetTodayQueue } from "../services/adminService.js";
import { emit, SOCKET_EVENTS } from "../socket/events.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

/* ---------------------------------------------------------------------- */
/* Dashboard                                                               */
/* ---------------------------------------------------------------------- */

/** GET /api/admin/dashboard/stats — today's overview cards. */
export async function getStats(req, res) {
  try {
    const stats = await getDashboardStats();
    return sendSuccess(res, 200, { stats });
  } catch (err) {
    return sendError(res, 500, "Could not load dashboard stats.", err.message);
  }
}

/* ---------------------------------------------------------------------- */
/* Staff — registration approvals (existing)                              */
/* ---------------------------------------------------------------------- */

/** GET /api/admin/staff/pending — list staff awaiting approval. */
export async function listPendingStaff(req, res) {
  try {
    const pending = await Staff.find({ approvalStatus: "pending" }).sort({ createdAt: 1 });
    return sendSuccess(res, 200, { count: pending.length, staff: pending });
  } catch (err) {
    return sendError(res, 500, "Could not load pending staff.", err.message);
  }
}

/** PATCH /api/admin/staff/:id/approve */
export async function approveStaff(req, res) {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return sendError(res, 404, "Staff account not found.");
    if (staff.approvalStatus !== "pending") {
      return sendError(res, 409, `This account is already ${staff.approvalStatus}.`);
    }

    staff.approvalStatus = "approved";
    staff.reviewedBy = req.user._id;
    staff.reviewedAt = new Date();
    await staff.save();

    return sendSuccess(res, 200, { staff }, "Staff account approved.");
  } catch (err) {
    return sendError(res, 500, "Could not approve staff account.", err.message);
  }
}

/** PATCH /api/admin/staff/:id/reject */
export async function rejectStaff(req, res) {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return sendError(res, 404, "Staff account not found.");
    if (staff.approvalStatus !== "pending") {
      return sendError(res, 409, `This account is already ${staff.approvalStatus}.`);
    }

    staff.approvalStatus = "rejected";
    staff.reviewedBy = req.user._id;
    staff.reviewedAt = new Date();
    await staff.save();

    return sendSuccess(res, 200, { staff }, "Staff account rejected.");
  } catch (err) {
    return sendError(res, 500, "Could not reject staff account.", err.message);
  }
}

/* ---------------------------------------------------------------------- */
/* Staff Management (Module 4)                                            */
/* ---------------------------------------------------------------------- */

/** GET /api/admin/staff — full staff directory (all statuses). */
export async function listStaff(req, res) {
  try {
    const staff = await Staff.find({}).sort({ createdAt: -1 });
    return sendSuccess(res, 200, { count: staff.length, staff });
  } catch (err) {
    return sendError(res, 500, "Could not load staff.", err.message);
  }
}

/**
 * POST /api/admin/staff — admin-provisioned staff account.
 * Unlike self-registration (staffRegister), this is created pre-approved
 * since the admin is vouching for the account directly.
 */
export async function createStaff(req, res) {
  try {
    const { staffId, name, counterAssigned, email, password } = req.body;

    const existing = await Staff.findOne({ $or: [{ email }, { staffId }] });
    if (existing) {
      return sendError(res, 409, "A staff account with this ID or email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const staff = await Staff.create({
      staffId,
      name,
      counterAssigned,
      email,
      passwordHash,
      approvalStatus: "approved",
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    });

    return sendSuccess(res, 201, { staff }, "Staff account created.");
  } catch (err) {
    return sendError(res, 500, "Could not create staff account.", err.message);
  }
}

/** PATCH /api/admin/staff/:id — edit name / email / counter assignment. */
export async function updateStaff(req, res) {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return sendError(res, 404, "Staff account not found.");

    const { name, email, counterAssigned } = req.body;
    if (name !== undefined) staff.name = name;
    if (counterAssigned !== undefined) staff.counterAssigned = counterAssigned;
    if (email !== undefined) {
      const emailTaken = await Staff.findOne({ email, _id: { $ne: staff._id } });
      if (emailTaken) return sendError(res, 409, "That email is already in use by another staff account.");
      staff.email = email;
    }

    await staff.save();
    return sendSuccess(res, 200, { staff }, "Staff account updated.");
  } catch (err) {
    return sendError(res, 500, "Could not update staff account.", err.message);
  }
}

/** PATCH /api/admin/staff/:id/status — activate/deactivate. */
export async function setStaffStatus(req, res) {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") return sendError(res, 422, "isActive (boolean) is required.");

    const staff = await Staff.findById(req.params.id);
    if (!staff) return sendError(res, 404, "Staff account not found.");

    staff.isActive = isActive;
    await staff.save();

    // A deactivated staff member should immediately lose their counter —
    // otherwise the counter would sit "active" with nobody able to log
    // back in and release it.
    if (!isActive) {
      await Counter.updateMany(
        { staffOnDuty: staff._id },
        { staffOnDuty: null, status: "offline" }
      );
    }

    return sendSuccess(res, 200, { staff }, isActive ? "Staff account activated." : "Staff account deactivated.");
  } catch (err) {
    return sendError(res, 500, "Could not update staff status.", err.message);
  }
}

/** PATCH /api/admin/staff/:id/assign-counter — reassign to a different counter. */
export async function assignStaffCounter(req, res) {
  try {
    const { counterId } = req.body;
    if (!counterId) return sendError(res, 422, "counterId is required.");

    const staff = await Staff.findById(req.params.id);
    if (!staff) return sendError(res, 404, "Staff account not found.");

    const targetCounter = await Counter.findById(counterId);
    if (!targetCounter) return sendError(res, 404, "Counter not found.");

    // Release whichever counter this staff member currently holds, so it
    // doesn't stay stuck "active" with a staff member no longer assigned.
    await Counter.updateMany(
      { staffOnDuty: staff._id },
      { staffOnDuty: null, status: "offline" }
    );

    staff.counterAssigned = targetCounter.name;
    await staff.save();

    return sendSuccess(res, 200, { staff }, `Assigned to ${targetCounter.name}.`);
  } catch (err) {
    return sendError(res, 500, "Could not assign staff to that counter.", err.message);
  }
}

/* ---------------------------------------------------------------------- */
/* Counter Management (Module 4)                                          */
/* ---------------------------------------------------------------------- */

/** GET /api/admin/counters */
export async function listCounters(req, res) {
  try {
    const counters = await Counter.find({}).sort({ counterNumber: 1 }).populate("staffOnDuty", "name staffId");
    return sendSuccess(res, 200, { count: counters.length, counters });
  } catch (err) {
    return sendError(res, 500, "Could not load counters.", err.message);
  }
}

/** POST /api/admin/counters — add a new counter. */
export async function createCounter(req, res) {
  try {
    const { name, counterNumber, tokenPrefix, servicesOffered } = req.body;

    const existing = await Counter.findOne({ $or: [{ name }, { counterNumber }] });
    if (existing) return sendError(res, 409, "A counter with that name or number already exists.");

    const counter = await Counter.create({
      name,
      counterNumber,
      tokenPrefix: tokenPrefix.toUpperCase(),
      servicesOffered: servicesOffered?.length ? servicesOffered : [],
    });

    const io = req.app.get("io");
    emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { counterId: counter._id });

    return sendSuccess(res, 201, { counter }, "Counter added.");
  } catch (err) {
    return sendError(res, 500, "Could not add counter.", err.message);
  }
}

/** PATCH /api/admin/counters/:id — edit name / services offered. */
export async function updateCounter(req, res) {
  try {
    const counter = await Counter.findById(req.params.id);
    if (!counter) return sendError(res, 404, "Counter not found.");

    const { name, servicesOffered } = req.body;
    if (name !== undefined) {
      const nameTaken = await Counter.findOne({ name, _id: { $ne: counter._id } });
      if (nameTaken) return sendError(res, 409, "That counter name is already in use.");
      counter.name = name;
    }
    if (servicesOffered !== undefined) counter.servicesOffered = servicesOffered;

    await counter.save();

    const io = req.app.get("io");
    emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { counterId: counter._id });

    return sendSuccess(res, 200, { counter }, "Counter updated.");
  } catch (err) {
    return sendError(res, 500, "Could not update counter.", err.message);
  }
}

/** PATCH /api/admin/counters/:id/toggle — enable/disable. */
export async function toggleCounter(req, res) {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") return sendError(res, 422, "isActive (boolean) is required.");

    const counter = await Counter.findById(req.params.id);
    if (!counter) return sendError(res, 404, "Counter not found.");

    counter.isActive = isActive;
    if (!isActive) {
      // Disabling a counter takes it fully offline and clears whoever's on it.
      counter.status = "offline";
      counter.staffOnDuty = null;
    }
    await counter.save();

    const io = req.app.get("io");
    emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { counterId: counter._id });

    return sendSuccess(res, 200, { counter }, isActive ? "Counter enabled." : "Counter disabled.");
  } catch (err) {
    return sendError(res, 500, "Could not update counter status.", err.message);
  }
}

/* ---------------------------------------------------------------------- */
/* Service Management (Module 4)                                          */
/* ---------------------------------------------------------------------- */

/** GET /api/admin/services */
export async function listServices(req, res) {
  try {
    const services = await Service.find({}).sort({ name: 1 });
    return sendSuccess(res, 200, { count: services.length, services });
  } catch (err) {
    return sendError(res, 500, "Could not load services.", err.message);
  }
}

/** POST /api/admin/services */
export async function createService(req, res) {
  try {
    const { name, description } = req.body;

    const existing = await Service.findOne({ name });
    if (existing) return sendError(res, 409, "A service with that name already exists.");

    const service = await Service.create({ name, description });
    return sendSuccess(res, 201, { service }, "Service added.");
  } catch (err) {
    return sendError(res, 500, "Could not add service.", err.message);
  }
}

/** PATCH /api/admin/services/:id */
export async function updateService(req, res) {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return sendError(res, 404, "Service not found.");

    const { name, description, isActive } = req.body;

    if (name !== undefined && name !== service.name) {
      const nameTaken = await Service.findOne({ name, _id: { $ne: service._id } });
      if (nameTaken) return sendError(res, 409, "That service name is already in use.");

      // Keep counters' servicesOffered lists (plain strings, not refs) in
      // sync with a rename so existing counter configuration doesn't
      // silently point at a service name that no longer exists.
      await Counter.updateMany(
        { servicesOffered: service.name },
        { $set: { "servicesOffered.$[elem]": name } },
        { arrayFilters: [{ elem: service.name }] }
      );
      service.name = name;
    }
    if (description !== undefined) service.description = description;
    if (typeof isActive === "boolean") service.isActive = isActive;

    await service.save();
    return sendSuccess(res, 200, { service }, "Service updated.");
  } catch (err) {
    return sendError(res, 500, "Could not update service.", err.message);
  }
}

/** DELETE /api/admin/services/:id */
export async function deleteService(req, res) {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return sendError(res, 404, "Service not found.");

    await service.deleteOne();
    // Also drop it from any counter's offered-services list. Existing
    // tokens keep their `service` string untouched — this only affects
    // what's offered going forward.
    await Counter.updateMany({}, { $pull: { servicesOffered: service.name } });

    return sendSuccess(res, 200, {}, "Service deleted.");
  } catch (err) {
    return sendError(res, 500, "Could not delete service.", err.message);
  }
}

/* ---------------------------------------------------------------------- */
/* Queue Management (Module 4)                                            */
/* ---------------------------------------------------------------------- */

/** POST /api/admin/queue/reset — Reset Today's Queue. */
export async function resetQueue(req, res) {
  try {
    const result = await resetTodayQueue(req.user._id);

    const io = req.app.get("io");
    // No counterId — this is a global reset, so every connected surface
    // (staff dashboards, TV display, kiosk) should refresh in full.
    emit(io, SOCKET_EVENTS.QUEUE_UPDATED, { reset: true });
    emit(io, SOCKET_EVENTS.DISPLAY_UPDATED, { reset: true });

    return sendSuccess(res, 200, { ...result }, "Today's queue has been reset.");
  } catch (err) {
    return sendError(res, 500, "Could not reset today's queue.", err.message);
  }
}
