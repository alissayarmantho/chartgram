import "./Menubar.css";
import { useClickAway } from "react-use";
import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Squash as Hamburger } from "hamburger-react";

const Menubar = ({ isOpen, setIsOpen, commandData }: any) => {
  const ref = useRef(null);

  useClickAway(ref, () => setIsOpen(false));
  return (
    <div
      ref={ref}
      style={{ position: "absolute", zIndex: 5 }}
      className="lg:hidden"
    >
      <Hamburger toggled={isOpen} size={20} toggle={setIsOpen} />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed shadow-4xl right-0 top-[3.5rem] p-5 pt-0 bg-neutral-950 border-b border-b-white/20"
          >
            <ul
              style={{
                position: "relative",
                left: "10px",
              }}
              className="nav-items"
            >
              {commandData.map((data: any, idx: number) => {
                return (
                  <motion.li
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1 + idx / 10,
                    }}
                    key={data.title}
                    className="w-full p-[0.08rem] px-10 rounded-xl bg-gradient-to-tr from-neutral-800 via-neutral-950 to-neutral-700"
                  >
                    <div
                      onClick={data.onClick}
                      className={
                        "flex items-center justify-between w-full p-5 rounded-xl bg-neutral-950"
                      }
                    >
                      <span style={{ display: "flex", padding: 13 }}>
                        {data.title}
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Menubar;
