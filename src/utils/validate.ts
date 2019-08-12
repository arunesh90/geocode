import * as Yup from "yup";

/**
 * Default validation options to use with Yup
 * See https://github.com/jquense/yup#mixedvalidatevalue-any-options-object-promiseany-validationerror
 * for more information on these
 */
export const validateOpts: Yup.ValidateOptions = {
  abortEarly: true,
  recursive: true,
  strict: false,
  stripUnknown: true,
};
